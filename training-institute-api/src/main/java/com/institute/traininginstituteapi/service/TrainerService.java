package com.institute.traininginstituteapi.service;

import com.institute.traininginstituteapi.dto.TrainerRequest;
import com.institute.traininginstituteapi.dto.TrainerResponse;
import com.institute.traininginstituteapi.entity.BatchStatus;
import com.institute.traininginstituteapi.entity.Trainer;
import com.institute.traininginstituteapi.exception.BusinessRuleException;
import com.institute.traininginstituteapi.exception.DuplicateResourceException;
import com.institute.traininginstituteapi.exception.ResourceNotFoundException;
import com.institute.traininginstituteapi.repository.BatchRepository;
import com.institute.traininginstituteapi.repository.TrainerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TrainerService {

    private static final List<BatchStatus> LIVE = List.of(BatchStatus.PLANNED, BatchStatus.RUNNING);

    private final TrainerRepository trainerRepository;
    private final BatchRepository batchRepository;

    public TrainerService(TrainerRepository trainerRepository, BatchRepository batchRepository) {
        this.trainerRepository = trainerRepository;
        this.batchRepository = batchRepository;
    }

    @Transactional(readOnly = true)
    public List<TrainerResponse> findAll(String search, Boolean active) {
        return trainerRepository.search(Text.clean(search), active).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TrainerResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    public TrainerResponse create(TrainerRequest req) {
        String code = Text.code(req.trainerCode());
        String email = Text.email(req.email());
        if (trainerRepository.existsByTrainerCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("trainerCode", "Trainer code " + code + " already exists");
        }
        if (trainerRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("email", "A trainer with email " + email + " already exists");
        }
        Trainer trainer = new Trainer();
        apply(trainer, req, code, email);
        return toResponse(trainerRepository.save(trainer));
    }

    public TrainerResponse update(Long id, TrainerRequest req) {
        Trainer trainer = getEntity(id);
        String code = Text.code(req.trainerCode());
        String email = Text.email(req.email());
        if (trainerRepository.existsByTrainerCodeIgnoreCaseAndTrainerIdNot(code, id)) {
            throw new DuplicateResourceException("trainerCode", "Trainer code " + code + " already exists");
        }
        if (trainerRepository.existsByEmailIgnoreCaseAndTrainerIdNot(email, id)) {
            throw new DuplicateResourceException("email", "A trainer with email " + email + " already exists");
        }
        if (Boolean.FALSE.equals(req.active()) && trainer.isActive()) {
            ensureNoLiveBatches(trainer);
        }
        apply(trainer, req, code, email);
        return toResponse(trainer);
    }

    /** Soft delete / reactivate. A trainer with planned or running batches must be reassigned first. */
    public TrainerResponse setActive(Long id, boolean active) {
        Trainer trainer = getEntity(id);
        if (!active) ensureNoLiveBatches(trainer);
        trainer.setActive(active);
        return toResponse(trainer);
    }

    public void delete(Long id) {
        Trainer trainer = getEntity(id);
        if (batchRepository.existsByTrainerTrainerId(id)) {
            throw new BusinessRuleException("Trainer " + trainer.getTrainerCode()
                    + " is assigned to batches and cannot be deleted. Deactivate the trainer instead.");
        }
        trainerRepository.delete(trainer);
    }

    Trainer getEntity(Long id) {
        return trainerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Trainer", id));
    }

    private void ensureNoLiveBatches(Trainer trainer) {
        long live = batchRepository.countByTrainerTrainerIdAndStatusIn(trainer.getTrainerId(), LIVE);
        if (live > 0) {
            throw new BusinessRuleException("Trainer " + trainer.getTrainerCode() + " has " + live
                    + " planned/running batch(es). Reassign them before deactivating.");
        }
    }

    private TrainerResponse toResponse(Trainer t) {
        return TrainerResponse.from(t, batchRepository.countByTrainerTrainerIdAndStatusIn(t.getTrainerId(), LIVE));
    }

    private void apply(Trainer trainer, TrainerRequest req, String code, String email) {
        trainer.setTrainerCode(code);
        trainer.setFullName(Text.clean(req.fullName()));
        trainer.setEmail(email);
        trainer.setPhone(Text.clean(req.phone()));
        trainer.setExpertise(Text.clean(req.expertise()));
        if (req.active() != null) trainer.setActive(req.active());
    }
}
